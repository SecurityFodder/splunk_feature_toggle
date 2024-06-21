import splunk.rest as rest

def log_audit_event(request):
    try:
        # Get data from the request
        savedsearch = request['query']['savedsearch']
        user = request['query']['user']
        action = request['query']['action']

        # Log the audit event (replace with your actual logging logic)
        audit_data = f"User '{user}' changed '{savedsearch}' to '{action}'"
        rest.simpleRequest("audit/events", method="POST", postargs={"name": "feature_toggle_audit", "event": audit_data})

        return {"payload": "Audit event logged successfully", "status": 200}
    except Exception as e:
        return {"payload": f"Error logging audit event: {e}", "status": 500}
