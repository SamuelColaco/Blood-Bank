import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  RegisterHospitalUseCase,
} from '../../application/use-cases/register-hospital/register-hospital.use-case';
import {
  RequestComponentUseCase,
} from '../../application/use-cases/request-component/request-component.use-case';
import {
  ProcessHospitalRequestUseCase,
} from '../../application/use-cases/process-hospital-request/process-hospital-request.use-case';
import {
  ConfirmHospitalRequestPickUseCase,
} from '../../application/use-cases/confirm-hospital-request-pick/confirm-hospital-request-pick.use-case';
import {
  OverrideComponentPickUseCase,
} from '../../application/use-cases/override-component-pick/override-component-pick.use-case';
import {
  ConfirmCrossmatchUseCase,
} from '../../application/use-cases/confirm-crossmatch/confirm-crossmatch.use-case';
import {
  AllocateHospitalRequestUseCase,
} from '../../application/use-cases/allocate-hospital-request/allocate-hospital-request.use-case';
import {
  StartTransportUseCase,
} from '../../application/use-cases/start-transport/start-transport.use-case';
import {
  RecordTransportTemperatureReadingUseCase,
} from '../../application/use-cases/record-transport-temperature/record-transport-temperature.use-case';
import {
  ConfirmDeliveryUseCase,
} from '../../application/use-cases/confirm-delivery/confirm-delivery.use-case';
import {
  CancelHospitalRequestUseCase,
} from '../../application/use-cases/cancel-hospital-request/cancel-hospital-request.use-case';
import { registerHospitalSchema } from '../dtos/distribution.dto';
import { requestComponentSchema } from '../dtos/distribution.dto';
import { confirmCrossmatchSchema } from '../dtos/distribution.dto';
import { overridePickSchema } from '../dtos/distribution.dto';
import { startTransportSchema } from '../dtos/distribution.dto';
import { transportReadingSchema } from '../dtos/distribution.dto';
import { cancelRequestSchema } from '../dtos/distribution.dto';

/**
 * HTTP entry points for the Distribuição bounded context. Deliberately thin:
 * every request is validated against a zod schema and handed straight to a
 * use case - no business logic lives here. This is the only layer that knows
 * it is being reached over HTTP.
 */
@Controller('distribution')
export class DistributionController {
  constructor(
    private readonly registerHospitalUseCase: RegisterHospitalUseCase,
    private readonly requestComponentUseCase: RequestComponentUseCase,
    private readonly processHospitalRequestUseCase: ProcessHospitalRequestUseCase,
    private readonly confirmHospitalRequestPickUseCase: ConfirmHospitalRequestPickUseCase,
    private readonly overrideComponentPickUseCase: OverrideComponentPickUseCase,
    private readonly confirmCrossmatchUseCase: ConfirmCrossmatchUseCase,
    private readonly allocateHospitalRequestUseCase: AllocateHospitalRequestUseCase,
    private readonly startTransportUseCase: StartTransportUseCase,
    private readonly recordTransportTemperatureReadingUseCase: RecordTransportTemperatureReadingUseCase,
    private readonly confirmDeliveryUseCase: ConfirmDeliveryUseCase,
    private readonly cancelHospitalRequestUseCase: CancelHospitalRequestUseCase,
  ) { }

  @Post('hospitals')
  registerHospital(@Body() body: unknown) {
    const input = registerHospitalSchema.parse(body);
    return this.registerHospitalUseCase.execute(input);
  }

  @Post('requests')
  requestComponent(@Body() body: unknown) {
    const input = requestComponentSchema.parse(body);
    return this.requestComponentUseCase.execute(input);
  }

  @Post('requests/:id/process')
  processHospitalRequest(@Param('id') id: string) {
    return this.processHospitalRequestUseCase.execute({ requestId: id });
  }

  @Put('requests/:id/pick/confirm')
  confirmHospitalRequestPick(@Param('id') id: string) {
    return this.confirmHospitalRequestPickUseCase.execute({ requestId: id });
  }

  @Put('requests/:id/pick/override')
  overrideComponentPick(@Param('id') id: string, @Body() body: unknown) {
    const input = overridePickSchema.parse(body);
    return this.overrideComponentPickUseCase.execute({ requestId: id, ...input });
  }

  @Put('requests/:id/crossmatch/confirm')
  confirmCrossmatch(@Param('id') id: string, @Body() body: unknown) {
    const input = confirmCrossmatchSchema.parse(body);
    return this.confirmCrossmatchUseCase.execute({
      requestId: id,
      ...input,
    });
  }

  @Put('requests/:id/allocate')
  allocateHospitalRequest(@Param('id') id: string) {
    return this.allocateHospitalRequestUseCase.execute({ requestId: id });
  }

  @Post('requests/:id/transport')
  startTransport(@Param('id') id: string, @Body() body: unknown) {
    const input = startTransportSchema.parse(body);
    return this.startTransportUseCase.execute({ requestId: id, ...input });
  }

  @Post('containers/:id/temperature')
  recordTransportTemperature(@Param('id') id: string, @Body() body: unknown) {
    const input = transportReadingSchema.parse(body);
    return this.recordTransportTemperatureReadingUseCase.execute({ containerId: id, ...input });
  }

  @Put('requests/:id/delivery/confirm')
  confirmDelivery(@Param('id') id: string) {
    return this.confirmDeliveryUseCase.execute({ requestId: id });
  }

  @Put('requests/:id/cancel')
  cancelHospitalRequest(@Param('id') id: string, @Body() body: unknown) {
    const input = cancelRequestSchema.parse(body);
    return this.cancelHospitalRequestUseCase.execute({ requestId: id, ...input });
  }
}
