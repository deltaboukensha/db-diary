import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import React, { useEffect, useState } from "react"
import {
  Button,
  CssBaseline,
  FormControlLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  debounce,
} from "@material-ui/core"
import { createTheme, ThemeProvider } from "@material-ui/core/styles"
import DeleteIcon from "@material-ui/icons/Delete"
import DeleteForeverIcon from "@material-ui/icons/DeleteForever"
import RestoreFromTrashIcon from "@material-ui/icons/RestoreFromTrash"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import DayjsUtils from "@date-io/dayjs"
import styles from "./styles.module.css"
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers"
import CalendarTodayIcon from "@material-ui/icons/CalendarToday"
import ShareIcon from "@material-ui/icons/Share"
import AccountCircleIcon from "@material-ui/icons/AccountCircle"
import CheckIcon from "@material-ui/icons/Check"
import ImportExportIcon from "@material-ui/icons/ImportExport"
import pluginWeekOfYear from "dayjs/plugin/weekOfYear"
import pluginCalendar from "dayjs/plugin/calendar"

dayjs.extend(pluginWeekOfYear)
dayjs.extend(pluginCalendar)

const theme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#FFFFFF",
    },
    secondary: {
      main: "#800080",
    },
  },
})

interface IEntryDiary {
  date: string
  text: string
  trash: boolean
}

interface IRecordDiary {
  id: string
  date: string
  text: string
  trash: boolean
}

interface IUser {
  uid: string
  displayName: string
  email: string
}

let unsubscribe: () => void = null

const signIn = async () => {
  const googleAuthProvider = new firebase.auth.GoogleAuthProvider()
  // await firebase.app().auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  await firebase.app().auth().signInWithRedirect(googleAuthProvider)
}

const updateRecord = async (record: IRecordDiary) => {
  const entry: IEntryDiary = {
    date: record.date,
    text: record.text,
    trash: record.trash,
  }
  await firebase
    .app()
    .firestore()
    .collection("user")
    .doc(await firebase.app().auth().currentUser.uid)
    .collection("diary")
    .doc(record.id)
    .set(entry)
}

const debouncedUpdateRecord = debounce(async (record: IRecordDiary) => {
  await updateRecord(record);
}, 1000);

const isInView = (element: Element) => {
  const { top, bottom } = element.getBoundingClientRect()
  const vHeight = window.innerHeight || document.documentElement.clientHeight
  return (top > 0 || bottom > 0) && top < vHeight
}

const scrollToRecord = async (record: IRecordDiary) => {
  const element = document.querySelector(`#${record.id}`)
  if (isInView(element)) return

  element.scrollIntoView({ behavior: "smooth", block: "start" })
}

export const Home = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false)
  const [user, setUser] = useState<IUser>(null)
  const [diaryList, setDiaryList] = useState<IRecordDiary[]>([])
  const [show, setShow] = useState<{ [key: string]: boolean }>({})
  const [anchorEl, setAnchorEl] = useState(null)
  const [showTrash, setShowTrash] = useState<boolean>(false)
  const [demoMode, setDemoMode] = useState<boolean>(false)

  const loadData = async () => {
    setLoading(true)

    unsubscribe = firebase
      .app()
      .firestore()
      .collection("user")
      .doc(await firebase.app().auth().currentUser.uid)
      .collection("diary")
      .orderBy("date", "desc")
      .onSnapshot(async (snapshot) => {
        const list: IRecordDiary[] = []
        for (const d of snapshot.docs) {
          const data = (await d.data()) as IEntryDiary
          const record: IRecordDiary = {
            id: d.id,
            text: data.text,
            date: data.date,
            trash: data.trash,
          }
          list.push(record)
        }
        console.log("list.length", list.length)
        setDiaryList(list)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (firebase.apps.length != 0) return

    setLoading(true)
    const firebaseConfig = {
      apiKey: "AIzaSyAAa6TM3BHE45ze-hfPPbC5ZbnIswk6ah8",
      // authDomain: "db-diary-ee778.firebaseapp.com",
      authDomain: "db-diary-ee778.web.app",
      databaseURL: "https://db-diary-ee778-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "db-diary-ee778",
      storageBucket: "db-diary-ee778.appspot.com",
      messagingSenderId: "774708687419",
      appId: "1:774708687419:web:27ac01b6253bf44ebbe21e",
    }
    firebase.initializeApp(firebaseConfig)

    firebase.auth().onAuthStateChanged(async (u) => {
      if (!u) {
        setUser(null)
        setDiaryList([])
        setLoading(false)
        return
      }

      setUser({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
      })
      await loadData()
    })
  }, [])
  const innerContent = () => (
    <>
      {loading ? <LinearProgress color="secondary" /> : <LinearProgress color="secondary" variant="determinate" value={100} />}
      {user && (
        <Button
          aria-controls="simple-menu"
          aria-haspopup="true"
          color="secondary"
          onClick={(e) => {
            setAnchorEl(e.currentTarget)
          }}
        >
          <AccountCircleIcon />
          &nbsp;{`${user.email}`}
        </Button>
      )}
      {loading && !user && <Button>Loading</Button>}
      {!loading && !user && (
        <Button
          aria-controls="simple-menu"
          aria-haspopup="true"
          color="primary"
          onClick={async () => {
            await signIn()
          }}
        >
          <AccountCircleIcon />
          &nbsp;Sign In
        </Button>
      )}
      <Menu
        id="simple-menu"
        color="secondary"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null)
        }}
      >
        {
          <MenuItem
            color="secondary"
            onClick={async () => {
              if (!window?.navigator?.share) return
              window.navigator.share({
                url: location.href,
              })
            }}
          >
            <ShareIcon />
            &nbsp;Share
          </MenuItem>
        }
        <MenuItem
          color="secondary"
          onClick={async () => {
            setAnchorEl(null)
            await signIn()
          }}
        >
          <AccountCircleIcon />
          &nbsp;Change User
        </MenuItem>
        <MenuItem
          color="secondary"
          onClick={async () => {
            setAnchorEl(null)
            unsubscribe()
            await firebase.app().auth().signOut()
          }}
        >
          <AccountCircleIcon />
          &nbsp;Sign Out
        </MenuItem>
        <MenuItem color="secondary" disabled={true}>
          <ImportExportIcon />
          &nbsp;Import
        </MenuItem>
        <MenuItem
          color="secondary"
          onClick={async () => {
            setAnchorEl(null)

            const j = JSON.stringify(diaryList, null, 2)
            const blob = new Blob([j], { type: "application/json" })
            const href = await URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = href
            link.download = "records.json"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }}
        >
          <ImportExportIcon />
          &nbsp;Export
        </MenuItem>
        <MenuItem color="secondary">
          <FormControlLabel
            control={
              <Switch
                onChange={(e) => {
                  setShowTrash(e.target.checked)
                }}
              />
            }
            label="View Trash"
          />
        </MenuItem>
        <MenuItem color="secondary">
          <FormControlLabel
            control={
              <Switch
                onChange={(e) => {
                  setDemoMode(e.target.checked)
                }}
              />
            }
            label="Demo Mode"
          />
        </MenuItem>
      </Menu>
      {!loading && user && (
        <div className={styles["new-entry"]}>
          <Button
            color="primary"
            onClick={async () => {
              const newEntry: IEntryDiary = {
                date: dayjs().toISOString(),
                text: "",
                trash: false,
              }

              await firebase
                .app()
                .firestore()
                .collection("user")
                .doc(await firebase.app().auth().currentUser.uid)
                .collection("diary")
                .add(newEntry)
            }}
          >
            New entry
          </Button>
        </div>
      )}
      {diaryList
        .filter((record) => (showTrash && record.trash) || (!showTrash && !record.trash))
        .map((record) => (
          <div key={record.id} id={record.id} className={styles["record"]}>
            <div className={styles["record-controls"]}>
              {!record.trash && (
                <Tooltip arrow title="Calendar">
                  <Button
                    color="secondary"
                    disabled={record.trash}
                    onClick={() => {
                      setShow({
                        ...show,
                        ["datepicker_" + record.id]: true,
                      })
                    }}
                  >
                    <CalendarTodayIcon />
                  </Button>
                </Tooltip>
              )}
              {show["datepicker_" + record.id] && (
                <DatePicker
                  color="secondary"
                  style={{ display: "none" }}
                  value={record.date}
                  hidden={true}
                  open={true}
                  showTodayButton={true}
                  onChange={async (d) => {
                    await updateRecord({
                      ...record,
                      date: d.toISOString(),
                    })
                    await scrollToRecord(record)
                  }}
                  onClose={() => {
                    setShow({
                      ...show,
                      ["datepicker_" + record.id]: false,
                    })
                  }}
                ></DatePicker>
              )}
              {!record.trash && (
                <Tooltip arrow title="Trash">
                  <Button
                    color="secondary"
                    onClick={async () => {
                      await updateRecord({
                        ...record,
                        trash: true,
                      })
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </Tooltip>
              )}
              {record.trash && (
                <Tooltip arrow title="Delete">
                  <Button
                    color="secondary"
                    onClick={async () => {
                      await firebase
                        .app()
                        .firestore()
                        .collection("user")
                        .doc(await firebase.app().auth().currentUser.uid)
                        .collection("diary")
                        .doc(record.id)
                        .delete()
                    }}
                  >
                    <DeleteForeverIcon />
                  </Button>
                </Tooltip>
              )}
              {record.trash && (
                <Tooltip arrow title="Restore">
                  <Button
                    color="secondary"
                    onClick={async () => {
                      await updateRecord({
                        ...record,
                        trash: false,
                      })
                    }}
                  >
                    <RestoreFromTrashIcon />
                  </Button>
                </Tooltip>
              )}
            </div>
            <TextField
              color="primary"
              disabled={record.trash}
              label={dayjs(record.date).calendar(null, {
                sameDay: "YYYY-MM-DD MMMM [w.]ww dddd [(Today)]",
                nextDay: "YYYY-MM-DD MMMM [w.]ww dddd [(Tomorrow)]",
                nextWeek: "YYYY-MM-DD MMMM [w.]ww dddd [(Next Week)]",
                lastDay: "YYYY-MM-DD MMMM [w.]ww dddd [(Yesterday)]",
                lastWeek: "YYYY-MM-DD MMMM [w.]ww dddd [(Last Week)]",
                sameElse: "YYYY-MM-DD MMMM [w.]ww dddd",
              })}
              multiline
              rows={8}
              defaultValue={record.text}
              variant="outlined"
              className={demoMode ? `${styles["record-text"]} ${styles["blurred"]}` : styles["record-text"]}
              onChange={async (e) => {
                console.log("onChange");
                if (e.target.value == record.text) return
                
                await debouncedUpdateRecord({
                  ...record,
                  text: e.target.value,
                });
              }}
              onBlur={async (e) => {
                console.log("onBlur");
                if (e.target.value == record.text) return
                
                await debouncedUpdateRecord({
                  ...record,
                  text: e.target.value,
                });
              }}
            />
          </div>
        ))}
    </>
  )

  return (<>
    <ThemeProvider theme={theme}>
      <Helmet>
        <title>db-diary</title>
        <meta name="mobile-web-app-capable" content="yes" />
      </Helmet>
      <MuiPickersUtilsProvider utils={DayjsUtils}>
        {innerContent()}
      </MuiPickersUtilsProvider>
      <CssBaseline></CssBaseline>
    </ThemeProvider>
  </>
  )
}
export default Home
