def execute(
    session,
    transaction_code
):

    session.findById(
        "wnd[0]/tbar[0]/okcd"
    ).text = f"/n{transaction_code}"

    session.findById(
        "wnd[0]"
    ).sendVKey(0)

    return True