import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  AuthUser,
  CreateCustomerDto,
  CreateCustomerResponseDto,
  GrpcErrorHandler,
  handleGrpcCall,
  LoggedUserType,
  LoginDto,
  LoginResponseDto,
  ProtoHelper,
  PublicRoute,
} from '@performa-edu/libs';
import {
  Customer,
  CUSTOMER_SERVICE_NAME,
  CUSTOMERSERVICE_PACKAGE_NAME,
  CustomerServiceClient,
} from '@performa-edu/proto-types/customer-service';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
} from 'types/proto/auth-service';

@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController implements OnModuleInit {
  private authService: AuthServiceClient;
  private customerService: CustomerServiceClient;

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private authClient: ClientGrpc,
    @Inject(CUSTOMERSERVICE_PACKAGE_NAME)
    private customerClient: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.authService =
      this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
    this.customerService =
      this.customerClient.getService<CustomerServiceClient>(
        CUSTOMER_SERVICE_NAME
      );
  }

  @PublicRoute()
  @Post('login')
  async login(@Body() options: LoginDto): Promise<{
    data: LoginResponseDto;
  }> {
    try {
      const response = await handleGrpcCall(
        this.authService.login(options),
        this.grpcErrorHandler,
        'Authentication failed'
      );

      return { data: response };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // @Auth([{ action: AclAction.CREATE, subject: AclSubject.ADMIN }])
  @Post('register-admin')
  async registerAdmin(@Body() options: RegisterAdminRequest): Promise<{
    data: RegisterAdminResponse;
  }> {
    const response = await handleGrpcCall(
      this.authService.registerAdmin(options),
      this.grpcErrorHandler,
      'Admin registration failed'
    );
    return { data: ProtoHelper.normalize<RegisterAdminResponse>(response, {}) };
  }

  @Post('register-customer')
  async registerCustomer(@Body() options: CreateCustomerDto): Promise<{
    data: CreateCustomerResponseDto;
  }> {
    let createdUserId: string | null = null;
    try {
      const { customer, user } = options;

      const createUser = await handleGrpcCall(
        this.authService.createUser({
          username: user.username,
          email: user.email,
          password: user.password,
          roleIds: user.roleIds,
        }),
        this.grpcErrorHandler,
        'User creation failed'
      );

      createdUserId = createUser.id;

      const createCustomer = await handleGrpcCall(
        this.customerService.createCustomer({
          ...customer,
          userId: createUser.id,
        }),
        this.grpcErrorHandler,
        'Customer creation failed'
      );

      const normalizedCustomer = ProtoHelper.normalize<Customer>(
        createCustomer.customer,
        {
          defaults: {
            deletedAt: null,
            dateOfBirth: null,
            user: null,
          },
        }
      );

      return {
        data: {
          user: createUser,
          customer: normalizedCustomer,
        },
      };
    } catch (error) {
      if (createdUserId) {
        try {
          await handleGrpcCall(
            this.authService.deleteUserById({ id: createdUserId }),
            this.grpcErrorHandler,
            'Failed to rollback user creation'
          );
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      console.error('Register customer error:', error);
      throw error;
    }
  }

  @Auth()
  @Get('getMe')
  async getProfile(@AuthUser() user: LoggedUserType): Promise<{
    data: ProfileResponse;
  }> {
    const userId = user.userId;
    const response = await handleGrpcCall(
      this.authService.getMe({ userId }),
      this.grpcErrorHandler,
      'Fetching profile failed'
    );

    return {
      data: ProtoHelper.normalize<ProfileResponse>(response, {
        defaults: {
          deletedAt: null,
          dateOfBirth: null,
          phoneNumber: null,
          profilePicture: null,
        },
      }),
    };
  }
}
