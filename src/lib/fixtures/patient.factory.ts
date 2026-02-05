import { fakerRU as faker } from '@faker-js/faker';
import { PatientPayload } from '../entities/patient.types';

export class PatientFactory {
  static createRandom(): PatientPayload {
    const sex = faker.person.sexType();
    
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName(sex);
    const middleName = faker.person.middleName(sex);

    // Дата рождения в формате "YYYY-MM-DD"
    const birthDateObj = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });
    const formattedBirthDate = birthDateObj.toISOString().split('T')[0]; // Получаем "1990-01-01"

    const rawPhone = faker.helpers.fromRegExp(/934[0-9]{7}/); 
    const formattedPhone = `+7 (${rawPhone.substring(0,3)}) ${rawPhone.substring(3,6)}-${rawPhone.substring(6,8)} ${rawPhone.substring(8,10)}`;

    return {
      user: {
        glossaryGenderId: sex === 'male' ? 1 : 2, 
        surname: lastName,
        name: firstName,
        patronymic: middleName,
        birthday: formattedBirthDate,
        phone: formattedPhone
      },
      comment: 'Auto-test generated via Playwright'
    };
  }
}