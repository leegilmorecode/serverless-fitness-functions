import { NagPackSuppression } from 'cdk-nag';

export const supressions: NagPackSuppression[] = [
  {
    id: 'AwsSolutions-COG4',
    reason: `Rule suppression for 'The REST API stage is not associated with AWS WAFv2 web ACL'`,
  },
  {
    id: 'AwsSolutions-APIG4',
    reason: `Rule suppression for 'The API does not implement authorization'`,
  },
  {
    id: 'AwsSolutions-IAM4',
    reason: `Rule suppression for 'The IAM user, role, or group uses AWS managed policies'`,
  },
  {
    id: 'AwsSolutions-APIG3',
    reason: `Rule suppression for 'The REST API stage is not associated with AWS WAFv2 web ACL'`,
  },
  {
    id: 'AwsSolutions-SNS2',
    reason: `Rule suppression for 'The SNS Topic does not have server-side encryption enabled'`,
  },
  {
    id: 'AwsSolutions-SNS3',
    reason: `Rule suppression for 'The SNS Topic does not require publishers to use SSL'`,
  },
  {
    id: 'AwsSolutions-IAM5',
    reason: `Rule suppression for 'The IAM entity contains wildcard permissions and does not have a cdk-nag rule suppression with evidence for those permission'`,
  },
  {
    id: 'AwsSolutions-APIG2',
    reason: `Rule suppression for 'The REST API does not have request validation enabled'`,
  },
];
