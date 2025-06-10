import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../../exceptions/bad-status-code.exception';
import { HttpRequest } from '../../types/http-request.type';
import { HttpResponse } from '../../types/http-response.type';
import ValidateHttpResponseUseCase from '../validate-http-response.use-case';

describe(ValidateHttpResponseUseCase.name, () => {
  const httpRequest: HttpRequest = {
    url: 'https://example.com',
  };

  it('should throw BadStatusCodeException when statusCode is not 200', () => {
    const httpResponse: HttpResponse = {
      data: {
        someField: 'Some value',
      } as never,
      headers: {},
      statusCode: StatusCode.ClientErrorBadRequest,
    };

    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
      request: httpRequest,
      response: httpResponse,
    });

    expect(() => {
      validateHttpResponseUseCase.execute();
    }).toThrow(BadStatusCodeException);
  });
});
