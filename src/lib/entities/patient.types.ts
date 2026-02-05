export interface PatientPayload {
  user: {
    glossaryGenderId: number;
    surname: string;
    name: string;
    patronymic: string | null;
    birthday: string;
    phone: string;
  };
  comment: string | null;
}

export interface PatientResponse {
  id: number;
  user: {
    name: string;
    surname: string;
    // ... остальные поля, которые возвращает сервер
  };
}