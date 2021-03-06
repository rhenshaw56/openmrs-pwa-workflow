import { call, put, takeLatest, select } from 'redux-saga/effects';
import {
  LOGIN_TYPES,
  patientActions,
  patientUtil, SESSION_TYPES,
  PATIENT_TYPES,
  visitActions,
  locationActions,
  sessionActions,
  patientIdentifierTypesActions,
  selectors,
  conceptActions,
  providerRest,
  sessionRest
} from '@openmrs/react-components';
import {history} from './store';
import ic3PatientActions from './patient/patientActions';
import IC3_PATIENT_TYPES from './patient/patientTypes';
import {ACTIVE_VISITS_REP} from './constants';
import reportingRest from './rest/reportingRest';
import * as R from "ramda";
import utils from "./utils";
import {CONCEPTS} from "./constants";

const createFromReportingRestRep = (restRep) => {
  let patient = {};
  patient._openmrsClass = "Patient";
  patient.uuid = restRep.patient_uuid;
  patient.gender = restRep.gender;
  patient.age = restRep.age_years;
  patient.birthdate = restRep.birthdate;
  patient.deceased = restRep.deceased;
  patient.chronic_care_diagnoses = restRep.chronic_care_diagnoses;

  patient.name = {
    givenName: restRep.first_name,
    familyName: restRep.last_name,
    fullName: `${restRep.first_name} ${restRep.last_name}`,
    reverseFullName: `${restRep.last_name} ${restRep.first_name}` 
  };
  
  if (restRep.identifiers) {
    restRep.identifiers.forEach((identifier) => {
      patient = patientUtil.addIdentifier(patient, identifier.raw_identifier, { uuid: identifier.identifierType }, identifier.preferred);
    });
  }

  patient.address = {
    village: restRep.village,
    traditionalAuthority: restRep.traditional_authority,
    district: restRep.district
  };

  // these are all non-standard props not part of the basic Patient rest rep (at least not yet)
  patient.chw = restRep.vhw;

  patient.phoneNumber = restRep.phone_number;
  patient.lastAppointmentDate = restRep.last_appt_date;
  patient.lastVisitDate = restRep.last_visit_date;

  patient.alert = restRep.alerts;

  patient.labTests = {
    viral_load_tests: restRep.viral_load_tests,
    hiv_tests: restRep.hiv_tests
  };

  return patient;
};


function flattenConcepts(concepts) {

  return Object.values(concepts).reduce(function (acc, concept) {

    // pull out the uuid and other props defined as custom overrides from the "others" (which assumedly are nested concepts)
    var { uuid, display, hiNormal, hiAbsolute, hiCritical, lowNormal, lowCritical, lowAbsolute, ...others } = concept;

    var conceptWithNestedConceptsRemoved = {
      uuid,
      display,
      hiNormal,
      hiCritical,
      hiAbsolute,
      lowNormal,
      lowCritical,
      lowAbsolute,
    };


    // if there are any "others", call flatten recursively and add to the list
    if (Object.values(others).length) {

      const flattened = flattenConcepts(others);

      acc = [
        ...acc,
        ...flattened
      ];
    }

    // add this concept to the list, assuming that we've found a uuid
    if (uuid) {
      acc = [
        ...acc,
        {
          ...R.filter(prop => prop !== undefined, conceptWithNestedConceptsRemoved)  // strip out any undefined object properties
        }
      ];
    }

    return acc;
  }, []);
}



function* getIC3Patients(action) {

  try {

    yield put(patientActions.setPatientStoreUpdating());

    // get IC3 patients
    // if "loadExpectedAppointments" = true, set cohort to null, which means load both expected, and patients with visits
    // if false, explicitly ask for only patients with visits
    // we break this up because the load expected appointment is the slow part of the query and never changes,
    // so we can just call in on initial login, location change, or date change
    let apptRestResponse = yield call(reportingRest.getIC3Patients, {
      location: action.location,
      endDate: action.endDate,
      cohorts: action.loadExpectedAppointments ? null : 'patientsWithVisit'
    });

    let patients = apptRestResponse.map((result) => {
      return createFromReportingRestRep(result);
    });

    // add the IC3 patients to the store
    yield put(patientActions.updatePatientsInStore(patients));

    // then fetch the set of active visits
    yield put(visitActions.fetchActiveVisits(action.location, ACTIVE_VISITS_REP));

  } catch (e) {
    yield put(ic3PatientActions.getIC3PatientsFailed(e.message));
    yield put(patientActions.setPatientStoreNotUpdating());
  }
}

// get the screening data for a single patient at the current location on the current date
function* getIC3PatientScreeningData(action) {

  const sessionLocation = yield select(selectors.getSessionLocation);

  try {
    // get patient appointment info
    let apptRestResponse = yield call(reportingRest.getScreeningData, {
      location: sessionLocation ? sessionLocation.uuid : null,
      //endDate: utils.formatReportRestDate(new Date()),  // server will automatically set to "today", avoid time zone issues
      patients: action.patient.uuid,
      useCachedValues: false
    });
    
    let patients = apptRestResponse.map((result) => {
      return createFromReportingRestRep(result);
    });
    if (patients && patients.length > 0) {
      yield put(patientActions.updatePatientInStore(patients[0]));
    }

  } catch (e) {
    yield put(ic3PatientActions.getIC3PatientScreeningDataFailed(e));
    yield put(patientActions.setPatientStoreNotUpdating());
  }

}

// we should just have the patient selected action trigger the getIC3PatientScreeningData directly, but this will trigger a new action,
// making it easiest to debug in the console, and allows us to add other actions if needed
function* patientSelected(action) {
  yield put(ic3PatientActions.getIC3PatientScreeningData(action.patient));
  yield put(ic3PatientActions.getIC3PatientNutritionHistory(action.patient));
}

// trigger everything that needs to happen on a login
function* initiateLoginActions(action) {
  yield createProviderAccountIfNecessary();
  yield put(locationActions.fetchAllLocations());
  yield put(conceptActions.fetchConcepts(flattenConcepts(CONCEPTS)));
  yield put(patientIdentifierTypesActions.fetchPatientIdentifierTypes());
  yield initiateIC3PatientsAction(action);
}

function* initiateLocationChangeActions(action) {
  yield call(history.push, '/');
  yield initiateIC3PatientsAction(action);
}

function* initiateIC3PatientsAction(action) {

  yield put(patientActions.clearPatientStore());

  var state = R.pathOr(yield select(), ['payload'], action);
  if (R.path(['openmrs', 'session', 'authenticated'], state)) {
    yield put(ic3PatientActions.getIC3Patients(
      R.path(['openmrs', 'session', 'sessionLocation', 'uuid'], state),
      utils.formatReportRestDate(new Date()),
      true));  // loadExpectedPatients = true
  }

}

function* createProviderAccountIfNecessary() {
  const session = yield select(selectors.getSession);
  const currentProvider = session.currentProvider;
  if (!currentProvider || !currentProvider.uuid) {
    const user = session.user;
    // OpenMRS by default users the userId as the provider identifier if none specified, so we do the same here until we come up with something better
    yield call(providerRest.createProvider, {
      person: user.person.uuid,
      identifier: user.systemId
    });
    // we need to re-fetch the session after (and yield until this is complete)
    // not quite sure why, but we also need to set the session location again
    let sessionResponse = yield call(sessionRest.setCurrentSessionLocation, { location: session.sessionLocation.uuid });
    yield put(sessionActions.fetchSessionSucceeded(sessionResponse, { authorization: session.authorization }));
  }
}


function* ic3PatientSagas() {
  yield takeLatest(IC3_PATIENT_TYPES.GET_IC3_PATIENTS, getIC3Patients);
  yield takeLatest(IC3_PATIENT_TYPES.GET_IC3_PATIENT_SCREENING_DATA, getIC3PatientScreeningData);
  yield takeLatest(PATIENT_TYPES.SET_SELECTED_PATIENT, patientSelected);
  yield takeLatest(LOGIN_TYPES.LOGIN.SUCCEEDED, initiateLoginActions);
  yield takeLatest(SESSION_TYPES.SET_SUCCEEDED, initiateLocationChangeActions);
}

export default ic3PatientSagas;
