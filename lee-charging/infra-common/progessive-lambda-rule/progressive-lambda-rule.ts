import { Annotations, IAspect } from 'aws-cdk-lib';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IConstruct } from 'constructs';
import { ProgressiveLambda } from '../../shared-constructs';

export class ProgressiveLambdaRule implements IAspect {
  constructor() {}

  // ensure that we don't use the NodeJsFunction construct directly, so if we find one on the tree
  public visit(node: IConstruct): void {
    if (node instanceof NodejsFunction) {
      // ensure that the NodeJsFunction is a parent of a ProgressiveLambda construct
      if (!(node.node.scope instanceof ProgressiveLambda)) {
        Annotations.of(node).addError(
          'NodeJsFunction used directly. Please use ProgressiveLambda construct.'
        );
      }
    }
  }
}
