import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AutomationsService, CreateRuleDto, ProposeAiActionDto } from './automations.service';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('rules')
  async getRules() {
    return this.automationsService.getRules();
  }

  @Post('rules')
  async createRule(@Body() dto: CreateRuleDto, @Req() req: any) {
    return this.automationsService.createRule(req.user.employeeId, dto);
  }

  @Post('trigger')
  async trigger(@Body('event') event: string, @Body('payload') payload: Record<string, any>) {
    return this.automationsService.triggerEvent(event, payload);
  }

  @Post('ai/propose')
  async proposeAiAction(@Body() dto: ProposeAiActionDto, @Req() req: any) {
    return this.automationsService.proposeAiAction(req.user.employeeId, dto);
  }

  @Get('ai/pending')
  async getPendingAiConfirmations(@Req() req: any) {
    return this.automationsService.getPendingConfirmations(req.user.employeeId);
  }

  @Patch('ai/:id/confirm')
  async confirmAiAction(@Param('id') id: string, @Req() req: any) {
    return this.automationsService.confirmAiAction(id, req.user.employeeId);
  }

  @Patch('ai/:id/reject')
  async rejectAiAction(@Param('id') id: string, @Req() req: any) {
    return this.automationsService.rejectAiAction(id, req.user.employeeId);
  }
}
