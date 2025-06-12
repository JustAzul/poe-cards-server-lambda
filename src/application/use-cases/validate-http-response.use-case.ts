import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from 'application/exceptions/bad-status-code.exception';
import { HttpRequest } from 'application/types/http-request.type';
import { HttpResponse } from 'application/types/http-response.type';

export type ValidateHttpResponseProps<T> = {
  request: HttpRequest;
  response: HttpResponse<T>;
};

export default class ValidateHttpResponseUseCase {
  static execute<T = unknown>(props: ValidateHttpResponseProps<T>): void {
    const { response } = props;
    const { statusCode } = response;

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException(props);
    }
  }
}
