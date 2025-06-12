import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from 'application/exceptions/bad-status-code.exception';
import { HttpRequest } from 'application/types/http-request.type';
import { HttpResponse } from 'application/types/http-response.type';
import ValidateHttpResponseUseCase from 'application/use-cases/validate-http-response.use-case';

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

    expect(() => {
      ValidateHttpResponseUseCase.execute({
        request: httpRequest,
        response: httpResponse,
      });
    }).toThrow(BadStatusCodeException);
  });
});
