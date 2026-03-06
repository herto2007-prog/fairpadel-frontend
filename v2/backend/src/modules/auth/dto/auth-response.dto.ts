export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    documento: string;
    roles: string[];
  };
}
