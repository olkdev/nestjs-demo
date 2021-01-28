import {
  ApiStandardListResponse,
  ApiStandardResponse,
} from 'nestjs-xion/decorator';
import { PaginationInterceptor } from 'nestjs-xion/interceptor';

import {
  Controller,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Crud, CrudAuth } from '@nestjsx/crud';

import { Todo } from '#entities/todo.entity';
import { AuthStrategy } from '#v1/auth/auth.constant';

import { CreateTodoDTO } from './dtos/create-todo.dto';
import { UpdateTodoDTO } from './dtos/update-todo.dto';
import { TodoResponse } from './responses/todo.response';
import { TodoService } from './todo.service';

import type { CrudController } from '@nestjsx/crud';
import type { Account } from '#entities/account.entity';

@ApiTags('Todo')
@ApiSecurity(AuthStrategy.JWT)
@UseGuards(AuthGuard(AuthStrategy.JWT))
@Crud({
  model: { type: Todo },
  dto: { create: CreateTodoDTO, update: UpdateTodoDTO },
  query: {
    join: { account: { eager: true, select: false, required: true } },
    alwaysPaginate: true,
  },
  routes: {
    exclude: ['createManyBase', 'replaceOneBase'],
    getOneBase: {
      decorators: [
        ApiOperation({ summary: 'Read one todo' }),
        ApiStandardResponse({ type: TodoResponse }),
      ],
    },
    getManyBase: {
      decorators: [
        ApiOperation({ summary: 'Read many todos' }),
        ApiStandardListResponse({ type: TodoResponse }),
      ],
    },
    createOneBase: {
      decorators: [
        ApiOperation({ summary: 'Create a new todo' }),
        ApiStandardResponse({ status: HttpStatus.CREATED, type: TodoResponse }),
      ],
    },
    updateOneBase: {
      decorators: [
        ApiOperation({ summary: 'Update an existing todo' }),
        ApiStandardResponse({ type: TodoResponse }),
      ],
    },
    deleteOneBase: {
      decorators: [
        ApiOperation({ summary: 'Delete an existing todo' }),
        ApiStandardResponse(),
      ],
    },
  },
  params: { uuid: { field: 'uuid', type: 'uuid', primary: true } },
})
@CrudAuth({
  property: 'user',
  filter: ({ uuid }: Account) => ({ 'account.uuid': uuid }),
  persist: ({ uuid }: Account) => ({ account: { uuid } }),
})
@Controller('v1/todos')
@UseInterceptors(PaginationInterceptor)
export class TodoController implements CrudController<Todo> {
  constructor(readonly service: TodoService) {}
}
