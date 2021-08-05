import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Button, Fab, LinearProgress, Menu, MenuItem, Switch, TextField, Tooltip } from "@material-ui/core"
import { createTheme, ThemeProvider } from "@material-ui/core/styles"
import AddBoxIcon from "@material-ui/icons/AddBox"
import DeleteIcon from "@material-ui/icons/Delete"
import DeleteForeverIcon from "@material-ui/icons/DeleteForever"
import RestoreFromTrashIcon from "@material-ui/icons/RestoreFromTrash"
import dayjs from "dayjs"
import styles from "./styles.module.css"

const theme = createTheme({
  palette: {
    primary: {
      main: "#9370DB",
    },
    secondary: {
      main: "#11cb5f",
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

const signIn = async () => {
  const googleAuthProvider = new firebase.auth.GoogleAuthProvider()
  await firebase.app().auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
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

export const Home = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false)
  const [displayName, setDisplayName] = useState<string>(null)
  const [userUid, setUserUid] = useState<string>(null)
  const [diaryList, setDiaryList] = useState<IRecordDiary[]>([])
  const [showTrash, setShowTrash] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const loadData = async () => {
    setLoading(true)

    firebase
      .app()
      .firestore()
      .collection("user")
      .doc(await firebase.app().auth().currentUser.uid)
      .collection("diary")
      .where("trash", "!=", !showTrash)
      .orderBy("trash")
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
        setDiaryList(list)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (firebase.apps.length != 0) return

    setLoading(true)
    const firebaseConfig = {
      apiKey: "AIzaSyAAa6TM3BHE45ze-hfPPbC5ZbnIswk6ah8",
      authDomain: "db-diary-ee778.firebaseapp.com",
      databaseURL: "https://db-diary-ee778-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "db-diary-ee778",
      storageBucket: "db-diary-ee778.appspot.com",
      messagingSenderId: "774708687419",
      appId: "1:774708687419:web:27ac01b6253bf44ebbe21e",
    }
    firebase.initializeApp(firebaseConfig)

    firebase.auth().onAuthStateChanged(async (user) => {
      setDisplayName(user?.displayName)
      setUserUid(user?.uid)
      setLoading(false)

      if (!user) {
        setDiaryList([])
        setLoading(false)
        return
      }

      await loadData()
    })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      {loading ? <LinearProgress /> : <LinearProgress variant="determinate" value={100} />}
      {userUid && (
        <Button
          aria-controls="simple-menu"
          aria-haspopup="true"
          onClick={(e) => {
            setAnchorEl(e.currentTarget)
          }}
        >
          {displayName}
        </Button>
      )}
      {loading && !userUid && <Button>Loading</Button>}
      {!loading && !userUid && (
        <Button
          aria-controls="simple-menu"
          aria-haspopup="true"
          onClick={async () => {
            await signIn()
          }}
        >
          Sign In
        </Button>
      )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null)
        }}
      >
        <MenuItem
          onClick={async (e) => {
            setAnchorEl(null)
            await signIn()
          }}
        >
          Change User
        </MenuItem>
        <MenuItem
          onClick={async (e) => {
            setAnchorEl(null)
            await firebase.app().auth().signOut()
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>
      <Fab
        color="primary"
        aria-label="add"
        onClick={async () => {
          const diaryEntry: IEntryDiary = {
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
            .add(diaryEntry)
        }}
      >
        <AddBoxIcon />
      </Fab>
      {diaryList.map((record) => (
        <div key={record.id} className={styles["record"]}>
          <form noValidate>
            <TextField
              type="date"
              defaultValue={dayjs(record.date).format("YYYY-MM-DD")}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={async (e) => {
                await updateRecord({
                  ...record,
                  date: dayjs(e.target.value).toISOString(),
                })
              }}
            />
          </form>
          <Tooltip arrow title="Trash">
            <Button
              onClick={async () => {
                await updateRecord({
                  ...record,
                  trash: true,
                })
              }}
            >
              <DeleteIcon />{" "}
            </Button>
          </Tooltip>
          <Tooltip arrow title="Delete">
            <Button>
              <DeleteForeverIcon />{" "}
            </Button>
          </Tooltip>
          <Tooltip arrow title="Restore">
            <Button>
              <RestoreFromTrashIcon></RestoreFromTrashIcon>{" "}
            </Button>
          </Tooltip>
          <TextField
            label={dayjs(record.date).format("YYYY-MM-DD")}
            multiline
            rows={4}
            defaultValue={record.text}
            variant="outlined"
            className={styles["record-text"]}
            onBlur={async (e) => {
              if (e.target.value == record.text) return

              await updateRecord({
                ...record,
                text: e.target.value,
              })
            }}
          />
        </div>
      ))}
    </ThemeProvider>
  )
}
export default Home
