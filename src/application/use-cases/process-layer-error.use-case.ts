import UseCaseException from 'application/exceptions/use-case.exception';

interface ProcessLayerErrorUseCaseProps {
  error: unknown;
  sourceName: string;
}

export default class ProcessLayerErrorUseCase {
  static execute(props: ProcessLayerErrorUseCaseProps): UseCaseException {
    const { error, sourceName } = props;
    if (Object.prototype.hasOwnProperty.call(error, 'message')) {
      const { message } = error as Error;
      return new UseCaseException(sourceName, `${typeof error}: ${message}`);
    }

    return new UseCaseException(sourceName, `Unknown Error: ${String(error)}`);
  }
}
