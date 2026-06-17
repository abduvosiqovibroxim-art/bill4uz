import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PlayersModule } from "./players/players.module";
import { ClubsModule } from "./clubs/clubs.module";
import { TournamentsModule } from "./tournaments/tournaments.module";
import { RankingsModule } from "./rankings/rankings.module";
import { NewsModule } from "./news/news.module";
import { MediaModule } from "./media/media.module";
import { ApplicationsModule } from "./applications/applications.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MetaModule } from "./meta/meta.module";
import { EmailModule } from "./email/email.module";
import { BracketsModule } from "./brackets/brackets.module";
import { PrismaModule } from "./common/prisma.module";
import { BotModule } from "./bot/bot.module";
import { PlatformModule } from "./platform/platform.module";
import { BookingsModule } from "./bookings/bookings.module";
import { StaffModule } from "./staff/staff.module";
import { CashierModule } from "./cashier/cashier.module";
import { TeamsModule } from "./teams/teams.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PlatformModule,
    AuthModule,
    UsersModule,
    PlayersModule,
    ClubsModule,
    TournamentsModule,
    RankingsModule,
    NewsModule,
    MediaModule,
    ApplicationsModule,
    NotificationsModule,
    MetaModule,
    EmailModule,
    BracketsModule,
    BotModule,
    BookingsModule,
    StaffModule,
    CashierModule,
    TeamsModule
  ],
  controllers: [AppController]
})
export class AppModule {}
