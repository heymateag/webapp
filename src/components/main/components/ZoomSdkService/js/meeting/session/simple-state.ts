/**
 * A simple class to contain, read, and modify our app's state
 *
 * If familiar with redux, it is the recommend approach for state management
 */
class SimpleState {
  constructor() {
    this.selfId = -1;
    this.participantId = -1;
    this.hasParticipant = false;
  }

  public selfId: number;

  private participantId: number;

  private hasParticipant: boolean;

  /**
     * Resets state to default values
     */
  reset() {
    this.selfId = -1;
    this.participantId = -1;
    this.hasParticipant = false;
  }

  resetParticipantId() {
    this.participantId = -1;
  }
}

// Provide global state
export default (new SimpleState());
