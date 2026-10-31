import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsUUID } from "class-validator";

export class CreateStripeAccountDto{

    @ApiProperty({
        description: 'User Id from users table',
        example: '6c4d7fbc-3e9a-4c1a-9731-7b8cfd7d9f3a'
    })
    @IsNotEmpty()
    @IsUUID()
    id!: string;

    @ApiProperty({
        description: 'email ID of user',
        example: 'user@email.com'
    })
    @IsNotEmpty()
    @IsEmail()
    email!: string;
}