# One Login
"One Login" is a service provided by the UK government to allow citizens to create a login and prove their identity once. The login can then be used to access many different government services without
 the user needing to create multiple accounts.

The One Login service is made up mainly of a website and two mobile apps available on Android and iPhone. The website looks like one site to the end-user but is actually made up of multiple sites owned
by different teams and the various sites hand-off to each other as required during the user's journey.

Typically a user will start on government service's website that uses One Login. The service site (known as a relying party, or RP) will send the user to the One Login Authentication site to login,
they may then be passed to Orchestration which will decide where to route the user to. If they user needs to prove or re-prove their identity they will be sent to Identity Proving and Verification (known as IPV, or IPV Core).
Once the user has succeeded or failed in proving their identity IPV will send them back to Orchestration to continue their journey.

# IPV Core
This project; `core-front` is part of IPV Core. There is another project called `core-back` that works closely with `core-front` and contain most of the business logic of the system.

The main purpose of `core-front` is to display pages to the user and determine the action that the user wants to take on each page. Those actions are sent to `core-back` which then decides what to do next,
usually this will be to do some processing and then tell `core-front` to display another page to the user.

The pages displayed by `core-front` need to be clear, concise, and accessible - in accordance with the GOV.UK design system. Pages must be available in both English and Welsh.
They need to guide users through identity (re-)proving journeys so that the users can successfully prove their identity, and so gain access to the government service they want to use.
