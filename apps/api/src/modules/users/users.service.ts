import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { BeliefTag } from './entities/belief-tag.entity';
import { UserPreference } from './entities/user-preference.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(BeliefTag)
    private readonly beliefTagRepo: Repository<BeliefTag>,
    @InjectRepository(UserPreference)
    private readonly prefRepo: Repository<UserPreference>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['beliefTags', 'preferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async getProfile(username: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['beliefTags', 'preferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (existing) throw new ConflictException('Already following this user');

    await this.findById(followingId); // ensure target exists

    const follow = this.followRepo.create({ followerId, followingId });
    await this.followRepo.save(follow);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const result = await this.followRepo.delete({ followerId, followingId });
    if (result.affected === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
  }

  async getFollowers(userId: string, page = 1, limit = 20): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(userId: string, page = 1, limit = 20): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.following);
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      select: ['followingId'],
    });
    return follows.map((f) => f.followingId);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreference> {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefRepo.create({ userId, ...dto });
    } else {
      Object.assign(prefs, dto);
    }
    return this.prefRepo.save(prefs);
  }

  async getPreferences(userId: string): Promise<UserPreference> {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefRepo.create({ userId });
      prefs = await this.prefRepo.save(prefs);
    }
    return prefs;
  }

  async setBeliefTags(userId: string, tagIds: string[]): Promise<User> {
    const user = await this.findById(userId);
    const tags = await this.beliefTagRepo.find({ where: { id: In(tagIds) } });
    user.beliefTags = tags;
    return this.userRepo.save(user);
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    const saved = await this.userRepo.save(user);
    // Create default preferences
    const prefs = this.prefRepo.create({ userId: saved.id });
    await this.prefRepo.save(prefs);
    return saved;
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
