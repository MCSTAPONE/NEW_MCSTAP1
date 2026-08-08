def execute(session):

    session.findById(
        "wnd[0]"
    ).close()

    return True