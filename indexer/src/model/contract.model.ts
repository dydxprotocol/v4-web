import {Entity, IntColumn, PrimaryColumn} from '@subsquid/typeorm-store'

// Here we define `exchange` database table as TypeORM entity class.
//
// We do that with the help of decorators from `@subsquid/typeorm-store` package.
//
// Those decorators are convenience and restrictive wrappers around decorators from `typeorm`.
//
// All restrictions are related to the fact, that `@subsquid/typeorm-store`
// supports only primitive DML operations (insert, upsert, update and delete)
// without cascading.
@Entity()
export class Contract {
    constructor(props?: Partial<Contract>) {
        Object.assign(this, props)
    }

    // All entities must have single column primary key named `id`.
    @PrimaryColumn()
    id!: string

    @IntColumn({nullable: false})
    logsCount!: number

    @IntColumn({nullable: false})
    foundAt!: number
}
