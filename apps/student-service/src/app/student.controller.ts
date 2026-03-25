import { Controller } from '@nestjs/common';
import { StudentService } from './student.service';
import {
  StudentServiceController,
  StudentServiceControllerMethods,
  RegisterStudentRequest,
  RegisterStudentResponse,
  GetStudentByIdRequest,
  GetStudentByIdResponse,
  GetStudentByUserIdRequest,
  GetStudentByUserIdResponse,
  UpdateStudentRequest,
  UpdateStudentResponse,
  DeleteStudentRequest,
  DeleteStudentResponse,
  GetAllStudentsRequest,
  GetAllStudentsResponse,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  BulkCreateAssignmentsRequest,
  BulkCreateAssignmentsResponse,
  DeleteAssignmentRequest,
  DeleteAssignmentResponse,
  GetAssignmentRequest,
  GetAssignmentResponse,
  GetStudentAssignmentsRequest,
  GetStudentAssignmentsResponse,
  GetTeacherAssignmentsRequest,
  GetTeacherAssignmentsResponse,
  GetContentAssignmentsRequest,
  GetContentAssignmentsResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetProgressLogsRequest,
  GetProgressLogsResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
} from '@performa-edu/proto-types/student-service';

@Controller()
@StudentServiceControllerMethods()
export class StudentController implements StudentServiceController {
  constructor(private readonly studentService: StudentService) {}

  // ── Student CRUD ──

  async registerStudent(
    options: RegisterStudentRequest
  ): Promise<RegisterStudentResponse> {
    return this.studentService.registerStudent(options);
  }

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    return this.studentService.getProfilePictureUploadUrl(options);
  }

  async getStudentById(
    options: GetStudentByIdRequest
  ): Promise<GetStudentByIdResponse> {
    return this.studentService.getStudentById(options);
  }

  async getStudentByUserId(
    options: GetStudentByUserIdRequest
  ): Promise<GetStudentByUserIdResponse> {
    return this.studentService.getStudentByUserId(options);
  }

  async updateStudent(
    options: UpdateStudentRequest
  ): Promise<UpdateStudentResponse> {
    return this.studentService.updateStudent(options);
  }

  async deleteStudent(
    options: DeleteStudentRequest
  ): Promise<DeleteStudentResponse> {
    return this.studentService.deleteStudent(options);
  }

  async getAllStudents(
    options: GetAllStudentsRequest
  ): Promise<GetAllStudentsResponse> {
    return this.studentService.getAllStudents(options);
  }

  // ── Assignment management ──

  async createAssignment(
    options: CreateAssignmentRequest
  ): Promise<CreateAssignmentResponse> {
    return this.studentService.createAssignment(options);
  }

  async bulkCreateAssignments(
    options: BulkCreateAssignmentsRequest
  ): Promise<BulkCreateAssignmentsResponse> {
    return this.studentService.bulkCreateAssignments(options);
  }

  async deleteAssignment(
    options: DeleteAssignmentRequest
  ): Promise<DeleteAssignmentResponse> {
    return this.studentService.deleteAssignment(options);
  }

  async getAssignment(
    options: GetAssignmentRequest
  ): Promise<GetAssignmentResponse> {
    return this.studentService.getAssignment(options);
  }

  // ── Query assignments ──

  async getStudentAssignments(
    options: GetStudentAssignmentsRequest
  ): Promise<GetStudentAssignmentsResponse> {
    return this.studentService.getStudentAssignments(options);
  }

  async getTeacherAssignments(
    options: GetTeacherAssignmentsRequest
  ): Promise<GetTeacherAssignmentsResponse> {
    return this.studentService.getTeacherAssignments(options);
  }

  async getContentAssignments(
    options: GetContentAssignmentsRequest
  ): Promise<GetContentAssignmentsResponse> {
    return this.studentService.getContentAssignments(options);
  }

  // ── Progress tracking ──

  async updateProgress(
    options: UpdateProgressRequest
  ): Promise<UpdateProgressResponse> {
    return this.studentService.updateProgress(options);
  }

  async getProgressLogs(
    options: GetProgressLogsRequest
  ): Promise<GetProgressLogsResponse> {
    return this.studentService.getProgressLogs(options);
  }
}
