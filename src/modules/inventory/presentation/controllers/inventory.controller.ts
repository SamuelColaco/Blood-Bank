import { Body, Controller, Post } from '@nestjs/common';
import { RegisterBloodBagUseCase } from '../../application/use-cases/register-blood-bag/register-blood-bag.use-case';
import { SeparateComponentUseCase } from '../../application/use-cases/separate-component/separate-component.use-case';
import { RegisterEquipmentUseCase } from '../../application/use-cases/register-equipment/register-equipment.use-case';
import { registerBloodBagSchema } from '../dtos/register-blood-bag.dto';
import { separateComponentSchema } from '../dtos/separate-component.dto';
import { registerEquipmentSchema } from '../dtos/register-equipment.dto';

/**
 * HTTP entry points for the Inventory bounded context. Deliberately thin:
 * every request is validated against a zod schema and handed straight to
 * a use case - no business logic lives here. This is the only layer that
 * knows it is being reached over HTTP.
 */
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly registerBloodBagUseCase: RegisterBloodBagUseCase,
    private readonly separateComponentUseCase: SeparateComponentUseCase,
    private readonly registerEquipmentUseCase: RegisterEquipmentUseCase,
  ) { }

  @Post('blood-bags')
  async registerBloodBag(@Body() body: unknown) {
    const input = registerBloodBagSchema.parse(body);
    return this.registerBloodBagUseCase.execute(input);
  }

  @Post('blood-bags/separate')
  async separateComponent(@Body() body: unknown) {
    const input = separateComponentSchema.parse(body);
    return this.separateComponentUseCase.execute(input);
  }

  @Post('equipment')
  async registerEquipment(@Body() body: unknown) {
    const input = registerEquipmentSchema.parse(body);
    return this.registerEquipmentUseCase.execute(input);
  }
}
