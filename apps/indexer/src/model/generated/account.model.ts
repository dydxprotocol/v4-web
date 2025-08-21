import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Position} from "./position.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    address!: string | undefined | null

    @IntColumn_({nullable: true})
    subaccountNumber!: number | undefined | null

    @StringColumn_({nullable: true})
    subaccountId!: string | undefined | null

    @BooleanColumn_({nullable: true})
    isLiquidator!: boolean | undefined | null

    @BooleanColumn_({nullable: true})
    isHandler!: boolean | undefined | null

    @BooleanColumn_({nullable: true})
    isManager!: boolean | undefined | null

    @OneToMany_(() => Position, e => e.account)
    positions!: Position[]
}
