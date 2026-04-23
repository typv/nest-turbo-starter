import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BoilerPlate } from 'src/data-access/boiler-plate';
import { BoilerPlateConsumer } from './consumer/boiler-plate.consumer';
import { BoilerPlateController } from './boiler-plate.controller';
import { BoilerPlateService } from './boiler-plate.service';
import { BoilerPlateSharedModule } from './shared/boiler-plate-shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [] }),
    MikroOrmModule.forFeature([BoilerPlate]),
    BoilerPlateSharedModule,
    // logical modules
  ],
  controllers: [BoilerPlateController, BoilerPlateConsumer],
  providers: [BoilerPlateService],
  exports: [BoilerPlateService],
})
export class BoilerPlateModule {}
