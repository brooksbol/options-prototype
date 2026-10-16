package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.*;
import java.util.*;

/** Retained Activity availability diagnostic only; no lifecycle/lineage conclusion.
 * Does not traverse/normalize/materialize rows or invoke the public history GET.
 * Structural facts and evidenceSetId do not depend on transaction history.
 */
final class RetainedStructuralHistory {
    record Coverage(long observationCount,List<String> qualifications) {}
    static Coverage fidelity(Connection c,String account,ObjectMapper unused)throws SQLException {
        long count;
        try(var q=c.prepareStatement("SELECT COUNT(*) FROM brokerage_ledger_observation WHERE account=?")) {
            q.setString(1,account);try(var rs=q.executeQuery()){count=rs.getLong(1);}
        }
        return new Coverage(count,List.of("RETAINED_FIDELITY_ACTIVITY_OBSERVATIONS="+count,
                "Activity count is availability only, not lineage-bearing history composition, completeness or occurrence."));
    }
}
