import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'The post this comment belongs to' })
  @IsUUID()
  postId!: string;

  @ApiProperty({ description: 'Comment text', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for nested replies' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
