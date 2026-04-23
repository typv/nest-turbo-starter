import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BoilerPlate } from 'src/data-access/boiler-plate';
import { BoilerPlateHelperService } from './shared/boiler-plate-helper.service';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [] }),
    MikroOrmModule.forFeature([BoilerPlate]),
    // logic modules
  ],
  providers: [BoilerPlateHelperService],
  exports: [BoilerPlateHelperService],
})
export class BoilerPlateSharedModule {}
