import { PageMetaDto } from '../common';

export interface IResponse {
  statusCode: number;
  data: any;
  meta?: PageMetaDto;
}
