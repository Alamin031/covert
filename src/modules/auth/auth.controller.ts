import { Body, Controller, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { ApiBody } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';

class UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}
@ApiBearerAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  @Post('decode/:token')
  @ApiOperation({ summary: 'Decode and verify a JWT auth code (token)' })
  async decode(@Param('token') token: string) {
    return this.authService.decodeAuthCode(token);
  }

  @Post('admin-register')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new admin user' })
  async adminRegister(@Body() dto: RegisterDto) {
    return this.authService.adminRegister(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithCredentials(dto.email, dto.password);
  }

  @Post('social-login')
  @ApiOperation({ summary: 'Login with social provider (Google/Facebook)' })
  async socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user (client should remove token)' })
  async logout() {
    // Optionally, you can extract the token from headers if you want to support blacklisting
    return this.authService.logout();
  }

  @Post('update-password/:userId')
  @ApiOperation({ summary: 'Update user password' })
  @ApiBody({ type: UpdatePasswordDto })
  async updatePassword(
    @Param('userId') userId: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new BadRequestException(
        'Both oldPassword and newPassword are required',
      );
    }
    return this.authService.updatePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
