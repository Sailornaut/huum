import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType } from '../entities/moderation-action.entity';

export class ModerationActionDto {
  @ApiProperty({ description: 'Report ID this action addresses' })
  @IsUUID()
  reportId!: string;

  @ApiPropertyOptional({ description: 'Target user ID' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'Target post ID' })
  @IsOptional()
  @IsUUID()
  targetPostId?: string;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  action!: ActionType;

  @ApiProperty({ description: 'Reason for the moderation action' })
  @IsString()
  @MaxLength(2000)
  reason!: string;

  @ApiPropertyOptional({ description: 'Whether this action is visible in the public log' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
