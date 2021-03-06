import { patientObjByEncounterTypeFilter  } from "@openmrs/react-components";
import { ENCOUNTER_TYPES, ALERTS_CATEGORIES } from "../../constants";
import utils from "../../utils";

// only patients due for VL test
/*
A. Routine Viral Load:
- Alert = 'Due for routine VL'
- Action= 'Needs routine VL'

B. Viral Load Re-test
- Alert = 'High VL'
- Action= 'Consider confirmatory VL'
 */
const vlFilter = patient => {
  return utils.hasAlert(patient.alert, [
    ALERTS_CATEGORIES.VIRAL_LOAD_ALERT,
    ALERTS_CATEGORIES.SCREENING_ELIGIBILITY_ALERT
  ]);
};


export default {
  expected: patientObjByEncounterTypeFilter(ENCOUNTER_TYPES.CheckInEncounterType.uuid, 'exclude'),
  required: vlFilter,
  completed: patientObjByEncounterTypeFilter(ENCOUNTER_TYPES.VLEncounterType.uuid, 'include'),
};
