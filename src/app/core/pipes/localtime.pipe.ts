import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localTime',
  standalone: true,
})
export class LocalTimePipe implements PipeTransform {
  transform(value: string | null): string {
    if (value === undefined || value === null) {
      return ''; // Return an empty string or handle the case as needed
    }
    console.log(value);
    const date = new Date(value);
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    console.log(localDate.toLocaleString());
    return localDate.toLocaleString(); // Format the date in the user's local time
  }
}
