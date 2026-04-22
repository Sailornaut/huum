import { IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Perspective slider 0.0 (echo chamber) to 1.0 (max diversity)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  perspectiveSlider?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showSensitive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationEmails?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme?: string;
}
