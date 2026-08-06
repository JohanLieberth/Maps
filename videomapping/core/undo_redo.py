import copy

class UndoRedoStack:
    """
    Implements a robust Undo/Redo stack holding deep-copies of workspace states.
    Allows unlimited back and forth traversal of state configurations.
    """
    def __init__(self, max_depth=100):
        self.max_depth = max_depth
        self.undo_stack = []
        self.redo_stack = []

    def push_state(self, state):
        """
        Pushes a deep-copy of the current state to the undo stack and clears the redo stack.
        """
        # Save a deepcopy to avoid referencing active objects
        copied_state = copy.deepcopy(state)
        self.undo_stack.append(copied_state)

        # Enforce max depth
        if len(self.undo_stack) > self.max_depth:
            self.undo_stack.pop(0)

        self.redo_stack.clear()

    def undo(self, current_state):
        """
        Returns the previous state and pushes the current state to the redo stack.
        If undo is impossible, returns None.
        """
        if not self.undo_stack:
            return None

        prev_state = self.undo_stack.pop()
        self.redo_stack.append(copy.deepcopy(current_state))
        return prev_state

    def redo(self, current_state):
        """
        Returns the next state and pushes the current state to the undo stack.
        If redo is impossible, returns None.
        """
        if not self.redo_stack:
            return None

        next_state = self.redo_stack.pop()
        self.undo_stack.append(copy.deepcopy(current_state))
        return next_state

    def clear(self):
        self.undo_stack.clear()
        self.redo_stack.clear()

    def can_undo(self):
        return len(self.undo_stack) > 0

    def can_redo(self):
        return len(self.redo_stack) > 0
