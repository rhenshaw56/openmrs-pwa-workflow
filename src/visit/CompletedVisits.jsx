import React from "react";
import { connect } from "react-redux";
import { push } from 'connected-react-router';
import {patientActions, visitActions, List} from '@openmrs/react-components';
import utils from "../utils";


let CompletedVisits = props => {

  const columnDefs = [
    { headerName: 'uuid', hide: true, field: 'uuid' },
    { headerName: 'ART', valueGetter: function getArtIdentifier(params) { return utils.getPatientArtIdentifier(params.data); }},
    { headerName: 'EID', valueGetter: function getEidIdentifier(params) { return utils.getPatientEidIdentifier(params.data); }},
    { headerName: 'NCD', valueGetter: function getNcdIdentifier(params) { return utils.getPatientNcdIdentifier(params.data); }},
    { headerName: 'Given Name', field: 'name.givenName' },
    { headerName: 'Family Name', field: 'name.familyName' },
    { headerName: 'Gender', field: 'gender' },
    { headerName: 'Age', field: 'age' },
    { headerName: 'Village', field: 'village' },
    { headerName: 'Actions', field: 'actions' },
    { headerName: 'Alert', field: 'alert' },
    { headerName: 'Checked-in Time',
      valueGetter: function getCheckedInTime(params) {
        return utils.getPatientCheckedInTime(params.data);
      }
    },
    { headerName: 'Check-out Time',
      valueGetter: function getCheckOutTime(params) {
        return utils.getPatientCheckOutTime(params.data);
      }
    }
  ];

  const fetchListActionCreator =
    () => props.dispatch(visitActions.fetchInactiveVisits(
      utils.getEndOfYesterday(),
      props.session.sessionLocation ? props.session.sessionLocation.uuid : null));

  const onMountOtherActionCreators = [
    () => props.dispatch(patientActions.clearSelectedPatient())
  ];

  const rowSelectedActionCreators = [
    patientActions.setSelectedPatient,
    () =>  push({
      pathname: '/checkin/checkInComplete',
      state: {
        queueLink: '/checkin/checkInTabs'
      }
    })
  ];

  return (
    <div>
      <List
        columnDefs={columnDefs}
        fetchListActionCreator={fetchListActionCreator}
        onMountOtherActionCreators={onMountOtherActionCreators}
        rowData={props.rowData}
        onRowCount={props.onRowCount}
        rowSelectedActionCreators={rowSelectedActionCreators}
        title=""
      />
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    rowData: state.completedVisits,
    session: state.openmrs.session
  };
};

export default connect(mapStateToProps)(CompletedVisits);


