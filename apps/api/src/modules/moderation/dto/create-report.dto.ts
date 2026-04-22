import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportCategory } from '../entities/report.entity';

export class CreateReportDto {
  @ApiPropertyOptional({ description: 'ID of the post being reported' })
  @IsOptional()
  @IsUUID()
  reportedPostId?: string;

  @ApiPropertyOptional({ description: 'ID of the user being reported' })
  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @ApiProperty({ enum: ReportCategory })
  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @ApiPropertyOptional({ description: 'Additional context for the report' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
