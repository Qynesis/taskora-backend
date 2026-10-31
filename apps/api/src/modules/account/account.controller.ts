import { Controller, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedUser } from '@app/shared-types';
import { AccountDeletionService } from './account-deletion.service';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';

@Controller('me')
export class AccountController {
  constructor(private readonly accountDeletionService: AccountDeletionService) {}

  @Delete()
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Account deleted successfully')
  @ApiOperation({
    summary: 'Permanently delete the current user account',
    description:
      'Purges personal data (profile, identity documents, bank details, saved cards, push tokens), ' +
      'closes the Stripe account/customer, deletes the auth identity, and anonymizes the user. ' +
      'Financial and contractual records are retained (anonymized) for legal compliance. ' +
      'Blocked with 400 if the user has an active job, open payment, pending refund, or active subscription.',
  })
  @ApiResponse({ status: 200, schema: { example: { completed: true } } })
  @ApiResponse({ status: 400, description: 'Active obligations prevent deletion' })
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.accountDeletionService.deleteMyAccount(user.id);
    return { completed: true };
  }
}
