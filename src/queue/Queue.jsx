import React from 'react';
import { push } from 'connected-react-router';
import { visitActions } from '@openmrs/react-components';
import { DataGrid } from '@openmrs/react-components';

class Queue extends React.Component {

  constructor(props) {
    super(props);
    this.columnDefs =  [
      { headerName: 'patientUuid', hide: true, field: 'uuid' },
      //      { headerName: 'ID', valueGetter: 'data.identifier' },
      { headerName: 'Name', field: 'patient.person.preferredName.display' },
      { headerName: 'Gender', field: 'patient.person.gender' },
      { headerName: 'Age', field: 'patient.person.age' }
    ];
  }

  // TODO make this potentially come from props so we can override it?
  componentDidMount() {
    this.props.dispatch(visitActions.fetchActiveVisits("custom:(uuid,patient:default,encounters:default)"));
    this.interval = setInterval(() =>
      this.props.dispatch(visitActions.fetchActiveVisits("custom:(uuid,patient:default,encounters:default)")), 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  redirectToInfoPageActionCreator() {
    return push('/'); // needs to be overwritten in implementing methods
  }

  render() {
    return (
      <div>
        <DataGrid
          columnDefs={this.columnDefs}
          rowData={this.props.rowData}
          rowSelectedActionCreators={[this.redirectToInfoPageActionCreator]}
        />
      </div>
    );
  }

}

export default Queue;
