import React from 'react';
import {Col, ControlLabel, Grid, Row} from "react-bootstrap";
import {formActions, ObsHistory, selectors} from "@openmrs/react-components";
import {connect} from "react-redux";
import {CONCEPTS, ENCOUNTER_TYPES} from "../constants";

const CheckInSummary = props => {

  return (
    <Grid>
      <Row>
        <Col>
          <span><h4>Demographics</h4></span>
        </Col>
      </Row>
      {(typeof props.patient !== 'undefined') && (props.patient !== null) &&
      <span>
          <Row>
            <Col
              componentClass={ControlLabel}
            >
              Address
            </Col>
          </Row>
          <Row>
            <Col>
              {props.patient.address.village}<br/>
              {props.patient.address.traditionalAuthority}<br/>
              {props.patient.address.district}<br/>
              <br/>
            </Col>
          </Row>
        </span>
      }
      {(typeof props.patient !== 'undefined') && (props.patient !== null) &&
      <span>
          <Row>
            <Col componentClass={ControlLabel}>
              Phone
            </Col>
          </Row>
          <Row>
            <Col>
              {props.patient.phoneNumber}
            </Col>
          </Row>
        </span>
      }
      {(typeof props.patient !== 'undefined') && (props.patient !== null) &&
      <span>
          <Row>
            <Col componentClass={ControlLabel}>
              CHW
            </Col>
          </Row>
          <Row>
            <Col>
              {props.patient.chw}
            </Col>
          </Row>
        </span>
      }

      <Row>
        <Col>
          <span><h4>History</h4></span>
        </Col>
      </Row>
      <ObsHistory
        concepts={[
          CONCEPTS.SOURCE_OF_REFERRAL,
          CONCEPTS.SOURCE_OF_REFERRAL.Linkage_to_care_ID
        ]}
        editableEncounterTypes={[ENCOUNTER_TYPES.CheckInEncounterType]}
        onEditEncounterActionCreators={[
          (encounterUuid) => formActions.loadFormBackingEncounter(props.formInstanceId, encounterUuid)
        ]}
        onEditEncounterCallbacks={[
          props.gotoForm
        ]}
      />
    </Grid>
  );
};

const mapStateToProps = (state) => {
  let storePatient = selectors.getSelectedPatientFromStore(state);
  return {
    patient: storePatient
  };
};

export default connect(mapStateToProps)(CheckInSummary);

