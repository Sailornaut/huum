import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VoteValue } from '../entities/community-vote.entity';

export class CastVoteDto {
  @ApiProperty({ description: 'Report ID to vote on' })
  @IsUUID()
  reportId!: string;

  @ApiProperty({ enum: VoteValue })
  @IsEnum(VoteValue)
  vote!: VoteValue;
}
