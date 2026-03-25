import { PageMetaDto } from '@performa-edu/libs';
import {
  Assignment,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  BulkCreateAssignmentsRequest,
  BulkCreateAssignmentsResponse,
  DeleteAssignmentRequest,
  DeleteAssignmentResponse,
  GetAssignmentRequest,
  GetAssignmentResponse,
  GetStudentAssignmentsRequest,
  GetTeacherAssignmentsRequest,
  GetContentAssignmentsRequest,
} from '@performa-edu/proto-types/student-service';

export interface IAssignmentRepository {
  createAssignment(
    options: CreateAssignmentRequest
  ): Promise<CreateAssignmentResponse>;
  bulkCreateAssignments(
    options: BulkCreateAssignmentsRequest
  ): Promise<BulkCreateAssignmentsResponse>;
  deleteAssignment(
    options: DeleteAssignmentRequest
  ): Promise<DeleteAssignmentResponse>;
  getAssignment(options: GetAssignmentRequest): Promise<GetAssignmentResponse>;
  getStudentAssignments(
    options: GetStudentAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto }>;
  getTeacherAssignments(
    options: GetTeacherAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto }>;
  getContentAssignments(
    options: GetContentAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto; totalAssigned: number }>;
}
