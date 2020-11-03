import { DEFAULT_DATE_FORMAT, DATE_REGEX } from './constants';
import * as moment from 'moment';

export default class MomentDateRegex {
    replace(input: string): string {
        //A regex to capture multiple matches, each with a target group ({date:YYMMDD}) and date group (YYMMDD)
        const dateRegex = DATE_REGEX;
        const customFolderString = input;
        //Iterate through the matches to collect them in a single array
        const matches = [];
        let match;
        while(match = dateRegex.exec(customFolderString)){
          matches.push(match)
        }
        //Return the custom folder setting value if no dates are found
        if(!matches || matches.length === 0){
          return input;
        }
        const now = new Date();
        //Transform date matches into moment formatted dates
        const formattedDates = matches.map(m => {
          //Default to YYYYMMDDHHmm if {{date}} is used
          const dateFormat = m.groups.date === '' ? DEFAULT_DATE_FORMAT : m.groups.date;
          return [m.groups.target, 
            this.getMoment(now, dateFormat)];
        });
    
        //Check to see if any date formatting is needed. If not return the unformatted setting text.
        let output = customFolderString;
        formattedDates.forEach(fd => {
          output = output.replace(fd[0], fd[1]);
        })
        return output;
      }

      getMoment(now: Date, dateFormat: string) {
        if((window as any).moment) {
          return (window as any)
          .moment(now)
            .format(dateFormat)
        } else {
          return moment(now).format(dateFormat);
        }
      }
}