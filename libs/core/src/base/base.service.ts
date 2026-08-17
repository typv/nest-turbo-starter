import { Observable } from 'rxjs';
import { callMicroservice } from '../microservice/call-microservice';

export class BaseService {
  /** @see callMicroservice */
  protected async msResponse(res: Observable<any>, timeoutMs?: number): Promise<any> {
    return callMicroservice(res, timeoutMs);
  }
}
