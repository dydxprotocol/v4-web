import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"
import {PositionKey} from "./positionKey.model"
import {PositionChange} from "./_positionChange"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => PositionKey, {nullable: true})
    positionKey!: PositionKey

    @StringColumn_({nullable: false})
    collateralAmout!: string

    @StringColumn_({nullable: false})
    size!: string

    @IntColumn_({nullable: false})
    timestamp!: number

    @BooleanColumn_({nullable: false})
    latest!: boolean

    @Column_("varchar", {length: 9, nullable: false})
    change!: PositionChange
}
