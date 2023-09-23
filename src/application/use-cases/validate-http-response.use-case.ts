import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import { HttpRequest } from '../types/http-request.type';
import { HttpResponse } from '../types/http-response.type';

export type ValidateHttpResponseProps<T = unknown> = {
  request: HttpRequest;
  response: HttpResponse<T>;
};

export default class ValidateHttpResponseUseCase {
  private props: ValidateHttpResponseProps;

  public constructor(props: ValidateHttpResponseProps) {
    this.props = props;
  }

  public execute(): HttpResponse {
    const { response } = this.props;
    const { statusCode } = response;

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException(this.props);
    }

    return response;
  }
}
