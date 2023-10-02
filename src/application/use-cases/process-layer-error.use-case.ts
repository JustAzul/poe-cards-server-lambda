import UseCaseException from '../exceptions/use-case.exception';

interface ProcessLayerErrorUseCaseProps {
  sourceName: string;
}

export default class ProcessLayerErrorUseCase {
  private readonly props: ProcessLayerErrorUseCaseProps;

  constructor(props: ProcessLayerErrorUseCaseProps) {
    this.props = props;
  }

  execute(e: unknown): UseCaseException {
    const { sourceName } = this.props;

    if (Object.prototype.hasOwnProperty.call(e, 'message')) {
      const { message } = e as Error;
      return new UseCaseException(sourceName, `${typeof e}: ${message}`);
    }

    return new UseCaseException(sourceName, `Unknown Error: ${String(e)}`);
  }
}
