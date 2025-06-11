import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import { HttpRequest } from '../types/http-request.type';
import { HttpResponse } from '../types/http-response.type';

export type ValidateHttpResponseProps<T> = {
  request: HttpRequest;
  response: HttpResponse<T>;
};

export default class ValidateHttpResponseUseCase<T = unknown> {
  execute(props: ValidateHttpResponseProps<T>): void {
    const { response } = props;
    const { statusCode } = response;

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException(props);
    }
  }
}
