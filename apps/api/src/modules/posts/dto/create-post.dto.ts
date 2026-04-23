import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: 'Post content', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'Array of media URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({ enum: MediaType })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiPropertyOptional({ description: 'Parent post ID for thread replies' })
  @IsOptional()
  @IsUUID()
  parentPostId?: string;

  @ApiPropertyOptional({ description: 'Tag IDs to associate with this post' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Plain-text tags from the current web UI' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
