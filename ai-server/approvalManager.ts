import { EventEmitter } from 'events';

export type ApprovalDecision = 'approved' | 'rejected' | 'pending';

export interface PendingApproval {
    id: string;
    type: 'edit_file' | 'run_command';
    payload: any;
    decision: ApprovalDecision;
}

class ApprovalManager extends EventEmitter {
    private pending: Map<string, PendingApproval> = new Map();

    async requestApproval(type: PendingApproval['type'], payload: any): Promise<boolean> {
        const id = Math.random().toString(36).substring(7);
        const approval: PendingApproval = { id, type, payload, decision: 'pending' };

        this.pending.set(id, approval);
        this.emit('new_approval', approval);

        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const current = this.pending.get(id);
                if (current && current.decision !== 'pending') {
                    clearInterval(checkInterval);
                    const approved = current.decision === 'approved';
                    this.pending.delete(id);
                    resolve(approved);
                }
            }, 500);
        });
    }

    getPending() {
        return Array.from(this.pending.values());
    }

    respond(id: string, decision: ApprovalDecision) {
        const approval = this.pending.get(id);
        if (approval) {
            approval.decision = decision;
            this.pending.set(id, approval);
            return true;
        }
        return false;
    }
}

export const approvalManager = new ApprovalManager();
